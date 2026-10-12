using Microsoft.AspNetCore.Mvc;

using MohamedTransit.API.TestScripts;
using MohamedTransit.Application.Services;

namespace Transit.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly EndToEndTest _endToEndTest;

    public TestController(EndToEndTest endToEndTest)
    {
        _endToEndTest = endToEndTest;
    }

    [HttpGet("run-complete-test")]
    public async Task<IActionResult> RunCompleteTest()
    {
        try
        {
            var results = await _endToEndTest.RunCompleteWorkflowTest();

            return Ok(new
            {
                success = results.OverallSuccess,
                message = results.OverallSuccess ? "All tests passed successfully!" : "Some tests failed",
                results = results,
                summary = results.GetSummary()
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "Test execution failed",
                error = ex.Message
            });
        }
    }

    [HttpGet("test-data-seeding")]
    public async Task<IActionResult> TestDataSeeding()
    {
        try
        {
            var results = await _endToEndTest.RunCompleteWorkflowTest();

            return Ok(new
            {
                success = results.DataSeeding,
                message = results.DataSeeding ? "Data seeding test passed!" : "Data seeding test failed",
                dataSeeding = results.DataSeeding
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "Data seeding test failed",
                error = ex.Message
            });
        }
    }

    [HttpGet("test-role-permissions")]
    public async Task<IActionResult> TestRolePermissions()
    {
        try
        {
            var results = await _endToEndTest.RunCompleteWorkflowTest();

            return Ok(new
            {
                success = results.SuperAdminFlow && results.DataEncoderFlow && results.AssessorFlow &&
                         results.CustomerFlow && results.ManagerFlow && results.CaseExecutorFlow,
                message = "Role permission tests completed",
                roleTests = new
                {
                    superAdmin = results.SuperAdminFlow,
                    dataEncoder = results.DataEncoderFlow,
                    assessor = results.AssessorFlow,
                    customer = results.CustomerFlow,
                    manager = results.ManagerFlow,
                    caseExecutor = results.CaseExecutorFlow
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "Role permission tests failed",
                error = ex.Message
            });
        }
    }
}








